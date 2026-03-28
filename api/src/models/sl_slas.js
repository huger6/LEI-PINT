const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('sl_slas', {
    service_line_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      references: {
        model: 'services_lines',
        key: 'service_line_id'
      }
    },
    sla_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      references: {
        model: 'slas',
        key: 'sla_id'
      }
    }
  }, {
    sequelize,
    tableName: 'sl_slas',
    schema: 'public',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        name: "pk_sl_slas",
        unique: true,
        fields: [
          { name: "service_line_id" },
          { name: "sla_id" },
        ]
      },
      {
        name: "sl_slas_pk",
        unique: true,
        fields: [
          { name: "service_line_id" },
          { name: "sla_id" },
        ]
      },
    ]
  });
};
