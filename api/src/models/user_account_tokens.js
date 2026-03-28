const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
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
      allowNull: false,
      references: {
        model: 'users',
        key: 'user_id'
      }
    },
    token_value: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    token_type: {
      type: DataTypes.STRING(255),
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
    }
  }, {
    sequelize,
    tableName: 'user_account_tokens',
    schema: 'public',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        name: "idx_tokens_active_user",
        fields: [
          { name: "user_id" },
          { name: "token_type" },
        ]
      },
      {
        name: "pk_user_account_tokens",
        unique: true,
        fields: [
          { name: "token_id" },
        ]
      },
    ]
  });
};
