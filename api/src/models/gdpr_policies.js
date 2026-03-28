const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('gdpr_policies', {
    policy_id: {
      autoIncrement: true,
      autoIncrementIdentity: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    policy_type: {
      type: DataTypes.STRING(50),
      allowNull: false
    },
    version: {
      type: DataTypes.STRING(30),
      allowNull: false
    },
    policy_text: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    is_mandatory: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    },
    updated_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'administrators',
        key: 'user_id'
      }
    },
    created_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'administrators',
        key: 'user_id'
      }
    }
  }, {
    sequelize,
    tableName: 'gdpr_policies',
    schema: 'public',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        name: "gdpr_createdby_fk",
        fields: [
          { name: "created_by" },
        ]
      },
      {
        name: "gdpr_policies_pk",
        unique: true,
        fields: [
          { name: "policy_id" },
        ]
      },
      {
        name: "gdpr_updatedby_fk",
        fields: [
          { name: "updated_by" },
        ]
      },
      {
        name: "pk_gdpr_policies",
        unique: true,
        fields: [
          { name: "policy_id" },
        ]
      },
    ]
  });
};
