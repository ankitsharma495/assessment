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

@Table({
  tableName: "order_additional_charges",
  timestamps: true,
})
export class OrderAdditionalCharge extends Model {
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
  title!: string; // e.g. "GST (18%)", "Freight Charge", "Special Discount"

  @Column({
    type: DataType.ENUM("fixed", "percentage"),
    allowNull: false,
    defaultValue: "fixed",
  })
  chargeType!: "fixed" | "percentage";

  @Column({
    type: DataType.FLOAT,
    allowNull: false,
    defaultValue: 0,
  })
  value!: number; // Percentage rate (e.g., 18) or Fixed value (e.g., 50)

  @Column({
    type: DataType.FLOAT,
    allowNull: false,
    defaultValue: 0,
  })
  amount!: number; // Final computed currency amount for this charge

  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: false, // true = deduction (discount), false = addition (tax/freight)
  })
  isDeduction!: boolean;

  @CreatedAt
  createdAt!: Date;

  @UpdatedAt
  updatedAt!: Date;
}
