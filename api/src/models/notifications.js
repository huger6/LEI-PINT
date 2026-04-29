const Sequelize = require('sequelize');
module.exports = function (sequelize, DataTypes) {
  return sequelize.define('notifications', {
    notification_id: {
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
    notification_payload: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    notification_url: {
      type: DataTypes.STRING(512),
      allowNull: true
    },
    is_read: {
      type: DataTypes.BOOLEAN,
      allowNull: true
    },
    sent_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: Sequelize.Sequelize.fn('now')
    }
  }, {
    sequelize,
    tableName: 'notifications',
    schema: 'public',
    timestamps: false,
    underscored: true,
    indexes: [
      {
        name: "notifications_pk",
        unique: true,
        fields: [
          { name: "notification_id" },
        ]
      },
      {
        name: "pk_notifications",
        unique: true,
        fields: [
          { name: "notification_id" },
        ]
      },
      {
        name: "user_notifications_fk",
        fields: [
          { name: "user_id" },
        ]
      },
      {
        name: "notif_def_fk",
        fields: [
          { name: "definition_id" },
        ]
      },
      {
        name: "idx_notifications_unread",
        fields: [
          { name: "user_id" },
        ],
        where: {
          is_read: false
        }
      },
      {
        name: "idx_notifications_sent_at",
        fields: [
          { name: "sent_at", order: "DESC" },
        ]
      },
    ]
  });
};
