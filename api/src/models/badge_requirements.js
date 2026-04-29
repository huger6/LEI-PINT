const Sequelize = require('sequelize');
module.exports = function (sequelize, DataTypes) {
  return sequelize.define('badge_requirements', {
    requirement_id: {
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
    progression_stage_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'progression_stages',
        key: 'progression_stage_id'
      }
    },
    requirement_title: {
      type: DataTypes.STRING(150),
      allowNull: false
    },
    requirement_sequence: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    requirement_description: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    requirement_img_url: {
      type: DataTypes.STRING(512),
      allowNull: true
    },
    badge_points: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
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
    tableName: 'badge_requirements',
    schema: 'public',
    timestamps: false,
    underscored: true,
    indexes: [
      {
        name: "badge_requirements_pk",
        unique: true,
        fields: [
          { name: "requirement_id" },
        ]
      },
      {
        name: "pk_badge_requirements",
        unique: true,
        fields: [
          { name: "requirement_id" },
        ]
      },
      {
        name: "stages_requirements_fk",
        fields: [
          { name: "progression_stage_id" },
        ]
      },
      {
        name: "badges_requirements_fk",
        fields: [
          { name: "badge_id" },
        ]
      },
      {
        name: "requirements_createdby_fk",
        fields: [
          { name: "created_by" },
        ]
      },
      {
        name: "requirements_updatedby_fk",
        fields: [
          { name: "updated_by" },
        ]
      },
      {
        name: "idx_requirements_sequence",
        fields: [
          { name: "badge_id" },
          { name: "requirement_sequence" },
        ]
      },
    ]
  });
};
