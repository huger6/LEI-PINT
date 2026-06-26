const Sequelize = require('sequelize');
module.exports = function (sequelize, DataTypes) {
  return sequelize.define('rewards', {
    reward_id: {
      autoIncrement: true,
      autoIncrementIdentity: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    reward_guid: {
      type: DataTypes.UUID,
      allowNull: false,
      defaultValue: DataTypes.UUIDV4
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
    },
    img_url: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    reward_name: {
      type: DataTypes.STRING(150),
      allowNull: true
    },
    reward_description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    access_link: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    access_info: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    cost_points: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    },
    reward_category: {
      type: DataTypes.STRING(50),
      allowNull: true
    }
  }, {
    sequelize,
    tableName: 'rewards',
    schema: 'public',
    timestamps: false,
    underscored: true,
    indexes: [
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
      {
        name: "badge_rewards_fk",
        fields: [
          { name: "badge_id" },
        ]
      },
    ]
  });
};
