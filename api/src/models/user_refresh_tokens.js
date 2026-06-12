const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('user_refresh_tokens', {
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
    expires_at: {
      type: DataTypes.DATE,
      allowNull: false
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: Sequelize.Sequelize.fn('now')
    }
  }, {
    sequelize,
    tableName: 'user_refresh_tokens',
    schema: 'public',
    timestamps: false,
    underscored: true,
    indexes: [
      {
        name: "pk_user_refresh_tokens",
        unique: true,
        fields: [
          { name: "token_id" },
        ]
      },
    ]
  });
};
