import type { CreationOptional, InferAttributes, Model } from "sequelize";

export interface DiagnosisCategoryAttributes
  extends Model<
    InferAttributes<DiagnosisCategoryAttributes>,
    DiagnosisCategoryCreationAttributes
  > {
  id: CreationOptional<string>;
  code: string;
  name: string;
  description: string;
  is_notifiable: CreationOptional<boolean>;
  created_at: CreationOptional<Date>;
  updated_at: CreationOptional<Date>;
}

export interface DiagnosisCategoryCreationAttributes {
  id?: string;
  code: string;
  name: string;
  description: string;
  is_notifiable?: boolean;
}
