const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('service_line_leaders', {
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      references: {
        model: 'users',
        key: 'user_id'
      }
    },
    service_line_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'service_lines',
        key: 'service_line_id'
      }
    },
    biography: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  }, {
    sequelize,
    tableName: 'service_line_leaders',
    schema: 'public',
    timestamps: false,
    underscored: true,
    indexes: [
      {
        name: "pk_service_line_leaders",
        unique: true,
        fields: [
          { name: "user_id" },
        ]
      },
      {
        name: "service_line_leaders_pk",
        unique: true,
        fields: [
          { name: "user_id" },
        ]
      },
    ]
  });
};
