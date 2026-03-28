const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('rewards', {
    reward_id: {
      autoIncrement: true,
      autoIncrementIdentity: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    badge_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'badges',
        key: 'badge_id'
      }
    },
    special_title: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    special_portrait_svg: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  }, {
    sequelize,
    tableName: 'rewards',
    schema: 'public',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        name: "badge_rewards_fk",
        fields: [
          { name: "badge_id" },
        ]
      },
      {
        name: "pk_rewards",
        unique: true,
        fields: [
          { name: "reward_id" },
        ]
      },
      {
        name: "rewards_pk",
        unique: true,
        fields: [
          { name: "reward_id" },
        ]
      },
    ]
  });
};
