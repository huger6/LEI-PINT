const Sequelize = require('sequelize');
module.exports = function (sequelize, DataTypes) {
  return sequelize.define('reward_redemptions', {
    redemption_id: {
      autoIncrement: true,
      autoIncrementIdentity: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    redemption_guid: {
      type: DataTypes.UUID,
      allowNull: false,
      defaultValue: DataTypes.UUIDV4
    },
    reward_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'rewards',
        key: 'reward_id'
      }
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'user_id'
      }
    },
    points_spent: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    redeemed_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: Sequelize.literal('now()')
    }
  }, {
    sequelize,
    tableName: 'reward_redemptions',
    schema: 'public',
    timestamps: false,
    underscored: true,
    indexes: [
      {
        name: "pk_reward_redemptions",
        unique: true,
        fields: [{ name: "redemption_id" }]
      },
      {
        name: "idx_reward_redemptions_user",
        fields: [{ name: "user_id" }]
      }
    ]
  });
};
