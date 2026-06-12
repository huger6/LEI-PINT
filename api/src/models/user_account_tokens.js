const Sequelize = require('sequelize');
module.exports = function (sequelize, DataTypes) {
  return sequelize.define('user_account_tokens', {
    token_id: {
      autoIncrement: true,
      autoIncrementIdentity: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    token_value: {
      type: DataTypes.STRING(512),
      allowNull: false
    },
    token_type: {
      type: DataTypes.STRING(50),
      allowNull: false
    },
    expires_at: {
      type: DataTypes.DATE,
      allowNull: false
    },
    is_used: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: Sequelize.Sequelize.fn('now')
    }
  }, {
    sequelize,
    tableName: 'user_account_tokens',
    schema: 'public',
    timestamps: false,
    underscored: true,
    indexes: [
      {
        name: "pk_user_account_tokens",
        unique: true,
        fields: [
          { name: "token_id" },
        ]
      },
      {
        name: "idx_tokens_active_user",
        fields: [
          { name: "user_id" },
          { name: "token_type" },
        ],
        where: {
          is_used: false
        }
      },
      {
        name: "idx_account_tokens_value",
        fields: [
          { name: "token_value" },
        ]
      },
    ]
  });
};
