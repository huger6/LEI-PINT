const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('learning_paths', {
    learning_path_id: {
      autoIncrement: true,
      autoIncrementIdentity: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    path_title: {
      type: DataTypes.STRING(150),
      allowNull: false
    },
    path_slug: {
      type: DataTypes.STRING(512),
      allowNull: false,
      unique: "uk_slug_lp"
    },
    path_description: {
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
    tableName: 'learning_paths',
    schema: 'public',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        name: "admin_lp_fk",
        fields: [
          { name: "created_by" },
        ]
      },
      {
        name: "learning_paths_pk",
        unique: true,
        fields: [
          { name: "learning_path_id" },
        ]
      },
      {
        name: "lp_updatedby_fk",
        fields: [
          { name: "updated_by" },
        ]
      },
      {
        name: "pk_learning_paths",
        unique: true,
        fields: [
          { name: "learning_path_id" },
        ]
      },
      {
        name: "uk_slug_lp",
        unique: true,
        fields: [
          { name: "path_slug" },
        ]
      },
    ]
  });
};
