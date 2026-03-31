const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('consultant_areas', {
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      references: {
        model: 'consultants',
        key: 'user_id'
      }
    },
    area_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      references: {
        model: 'areas',
        key: 'area_id'
      }
    },
    is_primary: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    }
  }, {
    sequelize,
    tableName: 'consultant_areas',
    schema: 'public',
    timestamps: false,
    underscored: true,
    indexes: [
      {
        name: "consultant_areas_pk",
        unique: true,
        fields: [
          { name: "user_id" },
          { name: "area_id" },
        ]
      },
      {
        name: "pk_consultant_areas",
        unique: true,
        fields: [
          { name: "user_id" },
          { name: "area_id" },
        ]
      },
    ]
  });
};
