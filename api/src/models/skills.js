const Sequelize = require('sequelize');
module.exports = function (sequelize, DataTypes) {
  return sequelize.define('skills', {
    skills_id: {
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
    skill_name: {
      type: DataTypes.STRING(150),
      allowNull: false
    },
    skill_description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    created_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'administrators',
        key: 'user_id'
      }
    },
    updated_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'administrators',
        key: 'user_id'
      }
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
    tableName: 'skills',
    schema: 'public',
    timestamps: false,
    underscored: true,
    indexes: [
      {
        name: "pk_skills",
        unique: true,
        fields: [
          { name: "skills_id" },
        ]
      },
      {
        name: "skills_pk",
        unique: true,
        fields: [
          { name: "skills_id" },
        ]
      },
      {
        name: "badges_skills_fk",
        fields: [
          { name: "badge_id" },
        ]
      },
      {
        name: "skills_createdby_fk",
        fields: [
          { name: "created_by" },
        ]
      },
      {
        name: "skills_updatedby_fk",
        fields: [
          { name: "updated_by" },
        ]
      },
      {
        name: "idx_skills_name",
        fields: [
          { name: "skill_name" },
        ]
      },
    ]
  });
};
