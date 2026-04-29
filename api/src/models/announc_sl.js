const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('announc_sl', {
    announcement_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      references: {
        model: 'system_announcements',
        key: 'announcement_id'
      }
    },
    service_line_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      references: {
        model: 'service_lines',
        key: 'service_line_id'
      }
    }
  }, {
    sequelize,
    tableName: 'announc_sl',
    schema: 'public',
    timestamps: false,
    underscored: true,
    indexes: [
      {
        name: "announc_sl_pk",
        unique: true,
        fields: [
          { name: "announcement_id" },
          { name: "service_line_id" },
        ]
      },
      {
        name: "pk_announc_sl",
        unique: true,
        fields: [
          { name: "announcement_id" },
          { name: "service_line_id" },
        ]
      },
    ]
  });
};
