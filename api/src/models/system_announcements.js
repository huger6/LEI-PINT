const Sequelize = require('sequelize');
module.exports = function (sequelize, DataTypes) {
  return sequelize.define('system_announcements', {
    announcement_id: {
      autoIncrement: true,
      autoIncrementIdentity: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    announcement_title: {
      type: DataTypes.STRING(150),
      allowNull: false
    },
    announcement_message: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    starts_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    ends_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    announcement_type: {
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
    tableName: 'system_announcements',
    schema: 'public',
    timestamps: false,
    underscored: true,
    indexes: [
      {
        name: "pk_system_announcements",
        unique: true,
        fields: [
          { name: "announcement_id" },
        ]
      },
      {
        name: "system_announcements_pk",
        unique: true,
        fields: [
          { name: "announcement_id" },
        ]
      },
      {
        name: "announcements_admin_fk",
        fields: [
          { name: "created_by" },
        ]
      },
      {
        name: "announcements_updatedby_fk",
        fields: [
          { name: "updated_by" },
        ]
      },
      {
        name: "idx_announcements_active_dates",
        fields: [
          { name: "is_active" },
          { name: "starts_at" },
          { name: "ends_at" },
        ]
      },
    ]
  });
};
