const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('services_lines', {
    service_line_id: {
      autoIncrement: true,
      autoIncrementIdentity: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    learning_path_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'learning_paths',
        key: 'learning_path_id'
      }
    },
    service_line_name: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    sl_slug: {
      type: DataTypes.STRING(512),
      allowNull: false,
      unique: "uk_slug_services_lines"
    },
    service_line_description: {
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
    }
  }, {
    sequelize,
    tableName: 'services_lines',
    schema: 'public',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        name: "admin_sl_fk",
        fields: [
          { name: "created_by" },
        ]
      },
      {
        name: "idx_sl_lp_id",
        fields: [
          { name: "learning_path_id" },
        ]
      },
      {
        name: "pk_services_lines",
        unique: true,
        fields: [
          { name: "service_line_id" },
        ]
      },
      {
        name: "services_lines_pk",
        unique: true,
        fields: [
          { name: "service_line_id" },
        ]
      },
      {
        name: "sl_lp_fk",
        fields: [
          { name: "learning_path_id" },
        ]
      },
      {
        name: "sl_updatedby_fk",
        fields: [
          { name: "updated_by" },
        ]
      },
      {
        name: "uk_slug_services_lines",
        unique: true,
        fields: [
          { name: "sl_slug" },
        ]
      },
    ]
  });
};
