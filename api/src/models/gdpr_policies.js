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
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: Sequelize.Sequelize.fn('now')
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: Sequelize.Sequelize.fn('now')
    }
  }, {
    sequelize,
    tableName: 'gdpr_policies',
    schema: 'public',
    timestamps: false,
    underscored: true,
    indexes: [
      {
        name: "gdpr_policies_pk",
        unique: true,
        fields: [
          { name: "policy_id" },
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
