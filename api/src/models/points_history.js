const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('points_history', {
    points_history_id: {
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
        model: 'consultants',
        key: 'user_id'
      }
    },
    requirement_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'badge_requirements',
        key: 'requirement_id'
      }
    },
    badge_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'badges',
        key: 'badge_id'
      }
    },
    points_delta: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    justification: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  }, {
    sequelize,
    tableName: 'points_history',
    schema: 'public',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        name: "badges_points_fk",
        fields: [
          { name: "badge_id" },
        ]
      },
      {
        name: "cons_points_fk",
        fields: [
          { name: "user_id" },
        ]
      },
      {
        name: "idx_points_user_delta",
        fields: [
          { name: "user_id" },
          { name: "points_delta" },
        ]
      },
      {
        name: "pk_points_history",
        unique: true,
        fields: [
          { name: "points_history_id" },
        ]
      },
      {
        name: "points_history_pk",
        unique: true,
        fields: [
          { name: "points_history_id" },
        ]
      },
      {
        name: "requirements_points_fk",
        fields: [
          { name: "requirement_id" },
        ]
      },
    ]
  });
};
