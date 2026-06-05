const Sequelize = require('sequelize');
module.exports = function (sequelize, DataTypes) {
  return sequelize.define('goals', {
    goal_id: {
      autoIncrement: true,
      autoIncrementIdentity: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'consultants',
        key: 'user_id'
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
    application_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'badge_applications',
        key: 'application_id'
      }
    },
    event_title: {
      type: DataTypes.STRING(150),
      allowNull: false
    },
    event_description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    event_start_date: {
      type: DataTypes.DATE,
      allowNull: true
    },
    event_end_date: {
      type: DataTypes.DATE,
      allowNull: true
    },
    reminder_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    reminder_sent: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    auto_reminder_sent: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: Sequelize.Sequelize.fn('now')
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: Sequelize.Sequelize.fn('now')
    }
  }, {
    sequelize,
    tableName: 'goals',
    schema: 'public',
    timestamps: false,
    underscored: true,
    indexes: [
      {
        name: "goals_pk",
        unique: true,
        fields: [
          { name: "goal_id" },
        ]
      },
      {
        name: "pk_goals",
        unique: true,
        fields: [
          { name: "goal_id" },
        ]
      },
      {
        name: "cons_timelines_fk",
        fields: [
          { name: "user_id" },
        ]
      },
      {
        name: "timelines_applications_fk",
        fields: [
          { name: "application_id" },
        ]
      },
      {
        name: "goals_fk",
        fields: [
          { name: "badge_id" },
        ]
      },
    ]
  });
};
