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
  tableName: "credit_notes",
  timestamps: true,
})
export class CreditNote extends Model {
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
  creditNoteNumber!: string;

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
    type: DataType.STRING,
    allowNull: false,
  })
  reason!: string;

  @Column({
    type: DataType.DATEONLY,
    allowNull: false,
  })
  issueDate!: string;

  @Column({
    type: DataType.ENUM("Issued", "Applied", "Void"),
    allowNull: false,
    defaultValue: "Issued",
  })
  status!: "Issued" | "Applied" | "Void";

  @ForeignKey(() => User)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  createdByUserId!: number;

  @BelongsTo(() => User)
  createdBy!: User;

  @CreatedAt
  createdAt!: Date;

  @UpdatedAt
  updatedAt!: Date;
}
