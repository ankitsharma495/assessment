import request from "supertest";
import app from "../app";
import { sequelize } from "../config/database";

describe("Orders and Settlements API Requirements", () => {
  let authToken: string;
  let userId: number;
  let createdOrderId: number;
  let secondUserToken: string;

  beforeAll(async () => {
    process.env.NODE_ENV = "test";
    await sequelize.sync({ force: true });

    // Register a primary test user
    const signupRes = await request(app).post("/api/auth/signup").send({
      name: "Test Merchant",
      email: "merchant@test.com",
      password: "password123",
      role: "admin", // Attacker trying to escalate privilege
    });

    authToken = signupRes.body.data.token;
    userId = signupRes.body.data.user.id;

    // Register a second merchant user
    const user2Res = await request(app).post("/api/auth/signup").send({
      name: "Other Merchant",
      email: "merchant2@test.com",
      password: "password123",
    });

    secondUserToken = user2Res.body.data.token;
  });

  afterAll(async () => {
    await sequelize.close();
  });

  test("Security: Signup ignores client role and assigns 'user'", async () => {
    const meRes = await request(app)
      .get("/api/auth/me")
      .set("Authorization", `Bearer ${authToken}`);

    expect(meRes.status).toBe(200);
    expect(meRes.body.data.role).toBe("user");
  });

  test("1. Create an order (2 x $500 = $1,000 total, due in 7 days)", async () => {
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 7);
    const dueDateStr = dueDate.toISOString().split("T")[0];

    const res = await request(app)
      .post("/api/orders")
      .set("Authorization", `Bearer ${authToken}`)
      .send({
        customerName: "Acme Corp",
        dueDate: dueDateStr,
        items: [
          {
            description: "Widget Alpha",
            quantity: 2,
            unitPrice: 500,
          },
        ],
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.subtotal).toBe(1000);
    expect(res.body.data.totalAmount).toBe(1000);
    expect(res.body.data.totalPaid).toBe(0);
    expect(res.body.data.balanceDue).toBe(1000);
    expect(res.body.data.status).toBe("pending");

    createdOrderId = res.body.data.id;
  });

  test("Data Isolation: Non-admin user cannot access another user's order", async () => {
    const res = await request(app)
      .get(`/api/orders/${createdOrderId}`)
      .set("Authorization", `Bearer ${secondUserToken}`);

    expect([403, 404]).toContain(res.status);
  });

  test("2. Record payment of $400 -> status should be partially_paid, amount due $600", async () => {
    const res = await request(app)
      .post(`/api/orders/${createdOrderId}/payments`)
      .set("Authorization", `Bearer ${authToken}`)
      .send({
        amount: 400,
        paymentDate: new Date().toISOString().split("T")[0],
        notes: "First installment",
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);

    // Fetch order to verify derived status & balance
    const getRes = await request(app)
      .get(`/api/orders/${createdOrderId}`)
      .set("Authorization", `Bearer ${authToken}`);

    expect(getRes.body.data.status).toBe("partially_paid");
    expect(getRes.body.data.totalPaid).toBe(400);
    expect(getRes.body.data.balanceDue).toBe(600);
  });

  test("3. Record payment of $600 -> status should be paid, amount due $0", async () => {
    const res = await request(app)
      .post(`/api/orders/${createdOrderId}/payments`)
      .set("Authorization", `Bearer ${authToken}`)
      .send({
        amount: 600,
        paymentDate: new Date().toISOString().split("T")[0],
        notes: "Final balance settlement",
      });

    expect(res.status).toBe(201);

    const getRes = await request(app)
      .get(`/api/orders/${createdOrderId}`)
      .set("Authorization", `Bearer ${authToken}`);

    expect(getRes.body.data.status).toBe("paid");
    expect(getRes.body.data.totalPaid).toBe(1000);
    expect(getRes.body.data.balanceDue).toBe(0);
  });

  test("4. Attempt to record another $1 payment -> rejected with clear actionable error", async () => {
    const res = await request(app)
      .post(`/api/orders/${createdOrderId}/payments`)
      .set("Authorization", `Bearer ${authToken}`)
      .send({
        amount: 1,
        paymentDate: new Date().toISOString().split("T")[0],
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain("exceeds remaining balance");
  });

  test("5. Overdue status derivation for past due date", async () => {
    // Create an order with past due date
    const pastDate = "2025-01-01";
    const res = await request(app)
      .post("/api/orders")
      .set("Authorization", `Bearer ${authToken}`)
      .send({
        customerName: "Overdue Test Customer",
        dueDate: pastDate,
        items: [
          {
            description: "Service Charge",
            quantity: 1,
            unitPrice: 250,
          },
        ],
      });

    expect(res.status).toBe(201);
    expect(res.body.data.status).toBe("overdue");
  });

  test("Status Consistency: List view and detail view status match identically", async () => {
    const listRes = await request(app)
      .get("/api/orders")
      .set("Authorization", `Bearer ${authToken}`);

    expect(listRes.status).toBe(200);
    const targetOrderFromList = listRes.body.data.find(
      (o: any) => o.id === createdOrderId
    );

    const detailRes = await request(app)
      .get(`/api/orders/${createdOrderId}`)
      .set("Authorization", `Bearer ${authToken}`);

    expect(detailRes.status).toBe(200);

    expect(targetOrderFromList.status).toBe(detailRes.body.data.status);
    expect(targetOrderFromList.totalAmount).toBe(detailRes.body.data.totalAmount);
    expect(targetOrderFromList.totalPaid).toBe(detailRes.body.data.totalPaid);
    expect(targetOrderFromList.balanceDue).toBe(detailRes.body.data.balanceDue);
  });

  test("Concurrency: Parallel payment requests do not exceed order total amount", async () => {
    // Create a new order of $1000
    const createRes = await request(app)
      .post("/api/orders")
      .set("Authorization", `Bearer ${authToken}`)
      .send({
        customerName: "Concurrent Payment Customer",
        dueDate: "2030-01-01",
        items: [{ description: "Item 1", quantity: 1, unitPrice: 1000 }],
      });

    const orderId = createRes.body.data.id;

    // Fire 2 concurrent payment requests of $600 each
    const req1 = request(app)
      .post(`/api/orders/${orderId}/payments`)
      .set("Authorization", `Bearer ${authToken}`)
      .send({ amount: 600, paymentDate: "2030-01-01" });

    const req2 = request(app)
      .post(`/api/orders/${orderId}/payments`)
      .set("Authorization", `Bearer ${authToken}`)
      .send({ amount: 600, paymentDate: "2030-01-01" });

    const results = await Promise.all([req1, req2]);
    const statuses = results.map((r) => r.status);

    // Exactly one should succeed (201) and one should fail (400)
    expect(statuses).toContain(201);
    expect(statuses).toContain(400);

    // Check final order balance
    const finalOrderRes = await request(app)
      .get(`/api/orders/${orderId}`)
      .set("Authorization", `Bearer ${authToken}`);

    expect(finalOrderRes.body.data.totalPaid).toBe(600);
    expect(finalOrderRes.body.data.balanceDue).toBe(400);
    expect(finalOrderRes.body.data.totalPaid).toBeLessThanOrEqual(1000);
  });
});
