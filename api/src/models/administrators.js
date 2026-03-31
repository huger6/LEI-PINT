const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('administrators', {
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      references: {
        model: 'users',
        key: 'user_id'
      }
    },
    is_super_admin: {
      type: DataTypes.BOOLEAN,
      allowNull: true
    },
    location_id: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    interaction_id: {
      type: DataTypes.INTEGER,
      allowNull: true
    }
  }, {
    sequelize,
    tableName: 'administrators',
    schema: 'public',
    timestamps: false,
    underscored: true,
    indexes: [
      {
        name: "administrators_pk",
        unique: true,
        fields: [
          { name: "user_id" },
        ]
      },
      {
        name: "pk_administrators",
        unique: true,
        fields: [
          { name: "user_id" },
        ]
      },
    ]
  });
};
