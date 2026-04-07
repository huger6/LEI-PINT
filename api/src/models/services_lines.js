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
    tableName: 'services_lines',
    schema: 'public',
    timestamps: false,
    underscored: true,
    indexes: [
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
        name: "uk_slug_services_lines",
        unique: true,
        fields: [
          { name: "sl_slug" },
        ]
      },
    ]
  });
};
