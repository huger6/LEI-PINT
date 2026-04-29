const Sequelize = require('sequelize');
module.exports = function (sequelize, DataTypes) {
  return sequelize.define('users', {
    user_id: {
      autoIncrement: true,
      autoIncrementIdentity: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    full_name: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    username: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: "uk_usernam_users"
    },
    email_address: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: "uk_email_users"
    },
    password_hash: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    user_role: {
      type: DataTypes.STRING(50),
      allowNull: false,
      defaultValue: "Consultant"
    },
    user_guid: {
      type: DataTypes.UUID,
      allowNull: false,
      defaultValue: DataTypes.UUIDV4
    },
    phone_number: {
      type: DataTypes.STRING(20),
      allowNull: true
    },
    birthdate: {
      type: DataTypes.DATEONLY,
      allowNull: true
    },
    profile_img_url: {
      type: DataTypes.STRING(512),
      allowNull: true
    },
    preferred_lang_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
      references: {
        model: 'preferred_lang',
        key: 'preferred_lang_id'
      }
    },
    location_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'locations',
        key: 'location_id'
      }
    },
    approved_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'administrators',
        key: 'user_id'
      }
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    },
    email_confirmed: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    force_password_change: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    },
    last_login_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    last_online: {
      type: DataTypes.DATE,
      allowNull: true
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: Sequelize.Sequelize.fn('now')
    }
  }, {
    sequelize,
    tableName: 'users',
    schema: 'public',
    timestamps: false,
    underscored: true,
    indexes: [
      {
        name: "pk_users",
        unique: true,
        fields: [
          { name: "user_id" },
        ]
      },
      {
        name: "uk_email_users",
        unique: true,
        fields: [
          { name: "email_address" },
        ]
      },
      {
        name: "uk_usernam_users",
        unique: true,
        fields: [
          { name: "username" },
        ]
      },
      {
        name: "users_pk",
        unique: true,
        fields: [
          { name: "user_id" },
        ]
      },
      {
        name: "lang_user_fk",
        fields: [
          { name: "preferred_lang_id" },
        ]
      },
      {
        name: "location_user_fk",
        fields: [
          { name: "location_id" },
        ]
      },
      {
        name: "approvedby_user_fk",
        fields: [
          { name: "approved_by" },
        ]
      },
      {
        name: "idx_users_role_active",
        fields: [
          { name: "user_role" },
          { name: "is_active" },
        ]
      },
      {
        name: "idx_users_role_approved_by_active",
        fields: [
          { name: "user_role" },
          { name: "approved_by" },
        ],
        where: {
          is_active: true
        }
      },
      {
        name: "idx_users_full_name",
        fields: [
          { name: "full_name" },
        ]
      },
      {
        name: "idx_users_name_trgm",
        using: "gin",
        fields: [
          { name: "full_name", operator: "gin_trgm_ops" },
        ]
      },
      {
        name: "idx_users_email_confirmed",
        fields: [
          { name: "email_confirmed" },
        ],
        where: {
          email_confirmed: false
        }
      },
    ]
  });
};
