const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('announc_roles', {
    announcement_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      references: {
        model: 'system_announcements',
        key: 'announcement_id'
      }
    },
    role_name: {
      type: DataTypes.STRING(50),
      allowNull: false,
      primaryKey: true
    }
  }, {
    sequelize,
    tableName: 'announc_roles',
    schema: 'public',
    timestamps: false,
    underscored: true,
    indexes: [
      {
        name: "announc_roles_pk",
        unique: true,
        fields: [
          { name: "announcement_id" },
          { name: "role_name" },
        ]
      },
      {
        name: "pk_announc_roles",
        unique: true,
        fields: [
          { name: "announcement_id" },
          { name: "role_name" },
        ]
      },
    ]
  });
};
