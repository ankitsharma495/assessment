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
  tableName: "payments",
  timestamps: true,
})
export class Payment extends Model {
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
  paymentNumber!: string;

  @ForeignKey(() => Order)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  orderId!: number;

  @BelongsTo(() => Order)
  order!: Order;

  @Column({
    type: DataType.FLOAT,
    allowNull: false,
    validate: {
      min: 0.01,
    },
  })
  amount!: number;

  @Column({
    type: DataType.DATEONLY,
    allowNull: false,
  })
  paymentDate!: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
    defaultValue: "Bank Transfer",
  })
  paymentMethod!: string;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  notes?: string;

  @ForeignKey(() => User)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  recordedByUserId!: number;

  @BelongsTo(() => User)
  recordedBy!: User;

  @CreatedAt
  createdAt!: Date;

  @UpdatedAt
  updatedAt!: Date;
}
