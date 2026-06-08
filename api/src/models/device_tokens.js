const Sequelize = require('sequelize');
module.exports = function (sequelize, DataTypes) {
  return sequelize.define('device_tokens', {
    device_token_id: {
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
    fcm_token: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    device_name: {
      type: DataTypes.STRING(128),
      allowNull: true
    },
    platform: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: 'android',
      validate: {
        isIn: [['android', 'ios']]
      }
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: Sequelize.Sequelize.fn('now')
    },
    last_used_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: Sequelize.Sequelize.fn('now')
    }
  }, {
    sequelize,
    tableName: 'device_tokens',
    schema: 'public',
    timestamps: false,
    underscored: true,
    indexes: [
      {
        name: "device_tokens_pk",
        unique: true,
        fields: [
          { name: "device_token_id" },
        ]
      },
      {
        name: "pk_device_tokens",
        unique: true,
        fields: [
          { name: "device_token_id" },
        ]
      },
      {
        name: "idx_device_tokens_fcm_token",
        unique: true,
        fields: [
          { name: "fcm_token" },
        ]
      },
      {
        name: "idx_device_tokens_user_active",
        fields: [
          { name: "user_id" },
        ],
        where: {
          is_active: true
        }
      },
    ]
  });
};
