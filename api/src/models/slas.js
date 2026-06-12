const Sequelize = require('sequelize');
module.exports = function (sequelize, DataTypes) {
  return sequelize.define('slas', {
    sla_id: {
      autoIncrement: true,
      autoIncrementIdentity: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    sla_name: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    response_time_hours: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    start_date: {
      type: DataTypes.DATE,
      allowNull: false
    },
    end_date: {
      type: DataTypes.DATE,
      allowNull: false
    },
    target_profile: {
      type: DataTypes.STRING(128),
      allowNull: true
    },
    is_global: {
      type: DataTypes.BOOLEAN,
      allowNull: true
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    },
    sla_description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    definition_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'notification_definitions',
        key: 'definition_id'
      }
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'user_id'
      }
    },
    preference_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'notification_preferences',
        key: 'preference_id'
      }
    },
    created_by: {
      type: DataTypes.INTEGER,
      allowNull: false,
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
    tableName: 'slas',
    schema: 'public',
    timestamps: false,
    underscored: true,
    indexes: [
      {
        name: "pk_slas",
        unique: true,
        fields: [
          { name: "sla_id" },
        ]
      },
      {
        name: "sla_definitions_pk",
        unique: true,
        fields: [
          { name: "sla_id" },
        ]
      },
      {
        name: "admin_sla_fk",
        fields: [
          { name: "created_by" },
        ]
      },
      {
        name: "user_slas_fk",
        fields: [
          { name: "user_id" },
        ]
      },
      {
        name: "notif_slas2_fk",
        fields: [
          { name: "preference_id" },
        ]
      },
      {
        name: "not_def_slas_fk",
        fields: [
          { name: "definition_id" },
        ]
      },
      {
        name: "slas_updatedby_fk",
        fields: [
          { name: "updated_by" },
        ]
      },
      {
        name: "idx_slas_active_profile",
        fields: [
          { name: "is_active" },
          { name: "target_profile" },
        ]
      },
    ]
  });
};
