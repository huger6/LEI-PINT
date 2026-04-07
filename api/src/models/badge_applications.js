const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('badge_applications', {
    application_id: {
      autoIncrement: true,
      autoIncrementIdentity: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    badge_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'badges',
        key: 'badge_id'
      }
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'consultants',
        key: 'user_id'
      }
    },
    goal_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'goals',
        key: 'goal_id'
      }
    },
    certificate_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'certificates',
        key: 'certificate_id'
      }
    },
    awarded_badges_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'awarded_badges',
        key: 'awarded_badges_id'
      }
    },
    application_guid: {
      type: DataTypes.UUID,
      allowNull: false,
      defaultValue: DataTypes.UUIDV4,
      unique: "uk_guid_badge_applications"
    },
    application_state: {
      type: DataTypes.STRING(30),
      allowNull: false,
      defaultValue: "Open"
    },
    reviewer_notes: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    opened_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: Sequelize.Sequelize.fn('now')
    },
    submitted_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    closed_at: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    sequelize,
    tableName: 'badge_applications',
    schema: 'public',
    timestamps: false,
    underscored: true,
    indexes: [
      {
        name: "badge_applications_pk",
        unique: true,
        fields: [
          { name: "application_id" },
        ]
      },
      {
        name: "pk_badge_applications",
        unique: true,
        fields: [
          { name: "application_id" },
        ]
      },
      {
        name: "uk_guid_badge_applications",
        unique: true,
        fields: [
          { name: "application_guid" },
        ]
      },
    ]
  });
};
