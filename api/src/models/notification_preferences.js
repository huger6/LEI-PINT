const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('notification_preferences', {
    preference_id: {
      autoIncrement: true,
      autoIncrementIdentity: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    definition_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'notification_preferences',
        key: 'preference_id'
      }
    },
    sla_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'slas',
        key: 'sla_id'
      }
    },
    announcement_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'system_announcements',
        key: 'announcement_id'
      }
    },
    send_email: {
      type: DataTypes.BOOLEAN,
      allowNull: false
    },
    send_push: {
      type: DataTypes.BOOLEAN,
      allowNull: false
    },
    is_enabled: {
      type: DataTypes.BOOLEAN,
      allowNull: false
    },
    trigger_before_value: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    trigger_before_unit: {
      type: DataTypes.STRING(50),
      allowNull: true
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
    tableName: 'notification_preferences',
    schema: 'public',
    timestamps: false,
    underscored: true,
    indexes: [
      {
        name: "announc_notif2_fk",
        fields: [
          { name: "announcement_id" },
        ]
      },
      {
        name: "not_def_pref2_fk",
        fields: [
          { name: "definition_id" },
        ]
      },
      {
        name: "not_preferences_createdby_fk",
        fields: [
          { name: "created_by" },
        ]
      },
      {
        name: "not_preferences_updatedby_fk",
        fields: [
          { name: "updated_by" },
        ]
      },
      {
        name: "notif_slas_fk",
        fields: [
          { name: "sla_id" },
        ]
      },
      {
        name: "notificate_to_pk",
        unique: true,
        fields: [
          { name: "preference_id" },
        ]
      },
      {
        name: "pk_notification_preferences",
        unique: true,
        fields: [
          { name: "preference_id" },
        ]
      },
    ]
  });
};
