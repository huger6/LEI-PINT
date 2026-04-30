const Sequelize = require('sequelize');
module.exports = function (sequelize, DataTypes) {
  return sequelize.define('user_badges_interactions', {
    interaction_id: {
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
    badge_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'badges',
        key: 'badge_id'
      }
    },
    interaction_type: {
      type: DataTypes.STRING(50),
      allowNull: false
    },
    interaction_date: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: Sequelize.Sequelize.fn('now')
    }
  }, {
    sequelize,
    tableName: 'user_badges_interactions',
    schema: 'public',
    timestamps: false,
    underscored: true,
    indexes: [
      {
        name: "pk_user_badges_interactions",
        unique: true,
        fields: [
          { name: "interaction_id" },
        ]
      },
      {
        name: "user_badges_interactions_pk",
        unique: true,
        fields: [
          { name: "interaction_id" },
        ]
      },
      {
        name: "user_interactions_fk",
        fields: [
          { name: "user_id" },
        ]
      },
      {
        name: "badges_interactions_fk",
        fields: [
          { name: "badge_id" },
        ]
      },
      {
        name: "idx_interactions_user_date",
        fields: [
          { name: "user_id" },
          { name: "interaction_date", order: "DESC" },
        ]
      },
      {
        name: "idx_interactions_badge_date",
        fields: [
          { name: "badge_id" },
          { name: "interaction_date", order: "DESC" },
        ]
      },
    ]
  });
};
