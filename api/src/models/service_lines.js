const Sequelize = require('sequelize');
module.exports = function (sequelize, DataTypes) {
  return sequelize.define('service_lines', {
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
      unique: "uk_slug_service_lines"
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
    tableName: 'service_lines',
    schema: 'public',
    timestamps: false,
    underscored: true,
    indexes: [
      {
        name: "pk_service_lines",
        unique: true,
        fields: [
          { name: "service_line_id" },
        ]
      },
      {
        name: "service_lines_pk",
        unique: true,
        fields: [
          { name: "service_line_id" },
        ]
      },
      {
        name: "uk_slug_service_lines",
        unique: true,
        fields: [
          { name: "sl_slug" },
        ]
      },
      {
        name: "sl_lp_fk",
        fields: [
          { name: "learning_path_id" },
        ]
      },
      {
        name: "admin_sl_fk",
        fields: [
          { name: "created_by" },
        ]
      },
      {
        name: "sl_updatedby_fk",
        fields: [
          { name: "updated_by" },
        ]
      },
      {
        name: "idx_sl_lp_id",
        fields: [
          { name: "learning_path_id" },
        ]
      },
    ]
  });
};
