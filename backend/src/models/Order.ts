import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  BelongsTo,
  HasMany,
  CreatedAt,
  UpdatedAt,
} from "sequelize-typescript";
import { User } from "./User";
import { OrderItem } from "./OrderItem";
import { OrderAdditionalCharge } from "./OrderAdditionalCharge";
import { Payment } from "./Payment";
import { CreditNote } from "./CreditNote";
import { OrderAuditLog } from "./OrderAuditLog";

export type OrderStatus = "pending" | "partially_paid" | "paid" | "overdue";

@Table({
  tableName: "orders",
  timestamps: true,
})
export class Order extends Model {
  @Column({
    type: DataType.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  })
  id!: number;

  @Column({
    type: DataType.STRING,
    allowNull: false,
    unique: true,
  })
  orderNumber!: string;

  @ForeignKey(() => User)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  userId!: number;

  @BelongsTo(() => User)
  user!: User;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  customerName!: string;

  @Column({
    type: DataType.DATEONLY,
    allowNull: false,
  })
  orderDate!: string;

  @Column({
    type: DataType.DATEONLY,
    allowNull: false,
  })
  dueDate!: string;

  @Column({
    type: DataType.FLOAT,
    allowNull: false,
    defaultValue: 0,
  })
  subtotal!: number;

  @Column({
    type: DataType.FLOAT,
    allowNull: false,
    defaultValue: 0,
  })
  totalAmount!: number;

  @Column({
    type: DataType.FLOAT,
    allowNull: false,
    defaultValue: 0,
  })
  totalPaid!: number;

  @Column({
    type: DataType.FLOAT,
    allowNull: false,
    defaultValue: 0,
  })
  totalCreditNotes!: number;

  @Column({
    type: DataType.FLOAT,
    allowNull: false,
    defaultValue: 0,
  })
  balanceDue!: number;

  @Column({
    type: DataType.ENUM("pending", "partially_paid", "paid", "overdue"),
    allowNull: false,
    defaultValue: "pending",
  })
  status!: OrderStatus;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  notes?: string;

  @HasMany(() => OrderItem, { onDelete: "CASCADE" })
  items!: OrderItem[];

  @HasMany(() => OrderAdditionalCharge, { onDelete: "CASCADE" })
  additionalCharges!: OrderAdditionalCharge[];

  @HasMany(() => Payment, { onDelete: "CASCADE" })
  payments!: Payment[];

  @HasMany(() => CreditNote, { onDelete: "CASCADE" })
  creditNotes!: CreditNote[];

  @HasMany(() => OrderAuditLog, { onDelete: "CASCADE" })
  auditLogs!: OrderAuditLog[];

  @CreatedAt
  createdAt!: Date;

  @UpdatedAt
  updatedAt!: Date;
}
