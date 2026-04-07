const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('locations', {
    location_id: {
      autoIncrement: true,
      autoIncrementIdentity: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    location_name: {
      type: DataTypes.STRING(128),
      allowNull: false
    }
  }, {
    sequelize,
    tableName: 'locations',
    schema: 'public',
    timestamps: false,
    underscored: true,
    indexes: [
      {
        name: "locations_pk",
        unique: true,
        fields: [
          { name: "location_id" },
        ]
      },
      {
        name: "pk_locations",
        unique: true,
        fields: [
          { name: "location_id" },
        ]
      },
    ]
  });
};
