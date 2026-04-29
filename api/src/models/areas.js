const Sequelize = require('sequelize');
module.exports = function (sequelize, DataTypes) {
  return sequelize.define('areas', {
    area_id: {
      autoIncrement: true,
      autoIncrementIdentity: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    service_line_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'service_lines',
        key: 'service_line_id'
      }
    },
    area_name: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    area_slug: {
      type: DataTypes.STRING(512),
      allowNull: false,
      unique: "uk_slug_areas"
    },
    area_code: {
      type: DataTypes.STRING(20),
      allowNull: true
    },
    area_description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    img_url: {
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
    tableName: 'areas',
    schema: 'public',
    timestamps: false,
    underscored: true,
    indexes: [
      {
        name: "areas_pk",
        unique: true,
        fields: [
          { name: "area_id" },
        ]
      },
      {
        name: "pk_areas",
        unique: true,
        fields: [
          { name: "area_id" },
        ]
      },
      {
        name: "uk_slug_areas",
        unique: true,
        fields: [
          { name: "area_slug" },
        ]
      },
      {
        name: "sl_areas_fk",
        fields: [
          { name: "service_line_id" },
        ]
      },
      {
        name: "area_createdby_fk",
        fields: [
          { name: "created_by" },
        ]
      },
      {
        name: "area_updatedby_fk",
        fields: [
          { name: "updated_by" },
        ]
      },
      {
        name: "idx_areas_sl_id",
        fields: [
          { name: "service_line_id" },
        ]
      },
    ]
  });
};
