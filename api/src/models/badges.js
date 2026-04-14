const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('badges', {
    badge_id: {
      autoIncrement: true,
      autoIncrementIdentity: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    progression_stage_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'progression_stages',
        key: 'progression_stage_id'
      },
      unique: "uk_stage_badge"
    },
    area_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'areas',
        key: 'area_id'
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
    badge_title: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    badge_slug: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: "uk_slug_badges"
    },
    badge_type: {
      type: DataTypes.STRING(128),
      allowNull: false
    },
    badge_points: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    expiration_duration_days: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    estimated_time_to_acquire: {
      type: DataTypes.TIME,
      allowNull: true
    },
    badge_description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    badge_img_url: {
      type: DataTypes.STRING(512),
      allowNull: true
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
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
    tableName: 'badges',
    schema: 'public',
    timestamps: false,
    underscored: true,
    indexes: [
      {
        name: "area_badges_fk",
        fields: [
          { name: "area_id" },
        ]
      },
      {
        name: "badges_createdby_fk",
        fields: [
          { name: "created_by" },
        ]
      },
      {
        name: "badges_pk",
        unique: true,
        fields: [
          { name: "badge_id" },
        ]
      },
      {
        name: "badges_updatedby_fk",
        fields: [
          { name: "updated_by" },
        ]
      },
      {
        name: "goals2_fk",
        fields: [
          { name: "goal_id" },
        ]
      },
      {
        name: "idx_badges_area_active",
        fields: [
          { name: "area_id" },
          { name: "is_active" },
        ]
      },
      {
        name: "idx_badges_points",
        fields: [
          { name: "badge_points", order: "DESC" },
        ]
      },
      {
        name: "idx_badges_title_trgm",
        fields: [
          { name: "badge_title" },
        ]
      },
      {
        name: "idx_badges_type",
        fields: [
          { name: "badge_type" },
        ]
      },
      {
        name: "pk_badges",
        unique: true,
        fields: [
          { name: "badge_id" },
        ]
      },
      {
        name: "stages_badges2_fk",
        fields: [
          { name: "progression_stage_id" },
        ]
      },
      {
        name: "uk_slug_badges",
        unique: true,
        fields: [
          { name: "badge_slug" },
        ]
      },
      {
        name: "uk_stage_badge",
        unique: true,
        fields: [
          { name: "progression_stage_id" },
        ]
      },
    ]
  });
};
