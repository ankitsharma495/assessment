import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  BelongsTo,
  CreatedAt,
  UpdatedAt,
} from "sequelize-typescript";
import { Order } from "./Order";
import { User } from "./User";

@Table({
  tableName: "order_audit_logs",
  timestamps: true,
})
export class OrderAuditLog extends Model {
  @Column({
    type: DataType.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  })
  id!: number;

  @ForeignKey(() => Order)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  orderId!: number;

  @BelongsTo(() => Order)
  order!: Order;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  action!: string; // e.g., ORDER_CREATED, PAYMENT_RECORDED, PAYMENT_DELETED, CREDIT_NOTE_ISSUED, STATUS_CHANGED

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  previousStatus?: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  newStatus?: string;

  @Column({
    type: DataType.TEXT,
    allowNull: false,
  })
  description!: string;

  @ForeignKey(() => User)
  @Column({
    type: DataType.INTEGER,
    allowNull: true,
  })
  performedByUserId?: number;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  performedByName?: string;

  @CreatedAt
  createdAt!: Date;

  @UpdatedAt
  updatedAt!: Date;
}
