const Sequelize = require('sequelize');
module.exports = function (sequelize, DataTypes) {
  return sequelize.define('user_notification_preferences', {
    user_pref_id: {
      autoIncrement: true,
      autoIncrementIdentity: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'user_id'
      }
    },
    definition_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'notification_definitions',
        key: 'definition_id'
      }
    },
    send_push: {
      type: DataTypes.BOOLEAN,
      allowNull: true
    },
    send_email: {
      type: DataTypes.BOOLEAN,
      allowNull: true
    },
    is_enabled: {
      type: DataTypes.BOOLEAN,
      allowNull: true
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: Sequelize.Sequelize.fn('now')
    }
  }, {
    sequelize,
    tableName: 'user_notification_preferences',
    schema: 'public',
    timestamps: false,
    underscored: true,
    indexes: [
      {
        name: "user_notification_preferences_pk",
        unique: true,
        fields: [
          { name: "user_pref_id" },
        ]
      },
      {
        name: "pk_user_notification_preferences",
        unique: true,
        fields: [
          { name: "user_pref_id" },
        ]
      },
      {
        name: "uq_user_def",
        unique: true,
        fields: [
          { name: "user_id" },
          { name: "definition_id" },
        ]
      },
      {
        name: "idx_user_notif_prefs_user",
        fields: [
          { name: "user_id" },
        ]
      },
      {
        name: "idx_user_notif_prefs_def",
        fields: [
          { name: "definition_id" },
        ]
      },
    ]
  });
};
