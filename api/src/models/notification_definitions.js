const Sequelize = require('sequelize');
module.exports = function (sequelize, DataTypes) {
  return sequelize.define('notification_definitions', {
    definition_id: {
      autoIncrement: true,
      autoIncrementIdentity: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    code: {
      type: DataTypes.STRING(128),
      allowNull: false
    },
    name: {
      type: DataTypes.STRING(256),
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    preference_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'notification_preferences',
        key: 'preference_id'
      }
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'administrators',
        key: 'user_id'
      }
    }
  }, {
    sequelize,
    tableName: 'notification_definitions',
    schema: 'public',
    timestamps: false,
    underscored: true,
    indexes: [
      {
        name: "notification_definitions_pk",
        unique: true,
        fields: [
          { name: "definition_id" },
        ]
      },
      {
        name: "pk_notification_definitions",
        unique: true,
        fields: [
          { name: "definition_id" },
        ]
      },
      {
        name: "admin_def_fk",
        fields: [
          { name: "user_id" },
        ]
      },
      {
        name: "not_def_pref_fk",
        fields: [
          { name: "preference_id" },
        ]
      },
    ]
  });
};
