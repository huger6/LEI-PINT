const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('consultants', {
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      references: {
        model: 'users',
        key: 'user_id'
      }
    },
    gdpr_accepted: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    biography: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    active_title: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    active_title_reward_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'rewards',
        key: 'reward_id'
      }
    }
  }, {
    sequelize,
    tableName: 'consultants',
    schema: 'public',
    timestamps: false,
    underscored: true,
    indexes: [
      {
        name: "consultants_pk",
        unique: true,
        fields: [
          { name: "user_id" },
        ]
      },
      {
        name: "pk_consultants",
        unique: true,
        fields: [
          { name: "user_id" },
        ]
      },
      {
        name: "idx_consultants_active_title_reward",
        fields: [
          { name: "active_title_reward_id" },
        ]
      },
    ]
  });
};
