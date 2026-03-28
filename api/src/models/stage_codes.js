const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('stage_codes', {
    stage_code_id: {
      autoIncrement: true,
      autoIncrementIdentity: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    stage_code: {
      type: DataTypes.STRING(20),
      allowNull: false,
      unique: "uk_code_stage_co"
    },
    created_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'administrators',
        key: 'user_id'
      }
    },
    updated_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'administrators',
        key: 'user_id'
      }
    }
  }, {
    sequelize,
    tableName: 'stage_codes',
    schema: 'public',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        name: "pk_stage_codes",
        unique: true,
        fields: [
          { name: "stage_code_id" },
        ]
      },
      {
        name: "stage_code_createdby_fk",
        fields: [
          { name: "created_by" },
        ]
      },
      {
        name: "stage_code_updatedby_fk",
        fields: [
          { name: "updated_by" },
        ]
      },
      {
        name: "stage_codes_pk",
        unique: true,
        fields: [
          { name: "stage_code_id" },
        ]
      },
      {
        name: "uk_code_stage_co",
        unique: true,
        fields: [
          { name: "stage_code" },
        ]
      },
    ]
  });
};
