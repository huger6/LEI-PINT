const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('progression_stages', {
    progression_stage_id: {
      autoIncrement: true,
      autoIncrementIdentity: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    area_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'areas',
        key: 'area_id'
      }
    },
    stage_code_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'stage_codes',
        key: 'stage_code_id'
      }
    },
    stage_title: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    stage_sequence: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    stage_description: {
      type: DataTypes.TEXT,
      allowNull: true
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
    tableName: 'progression_stages',
    schema: 'public',
    timestamps: false,
    underscored: true,
    indexes: [
      {
        name: "pk_progression_stages",
        unique: true,
        fields: [
          { name: "progression_stage_id" },
        ]
      },
      {
        name: "progression_stages_pk",
        unique: true,
        fields: [
          { name: "progression_stage_id" },
        ]
      },
    ]
  });
};
