const Sequelize = require('sequelize');
const { Op, literal } = require('sequelize');
module.exports = function (sequelize, DataTypes) {
  const Users = sequelize.define('users', {
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
    language_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
      references: {
        model: 'languages',
        key: 'language_id'
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
    current_streak_days: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
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
          { name: "language_id" },
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

  Users.buildUserFilter = function (params, models) {
    const where = {};

    if (params.search) {
      where[Op.or] = [
        { full_name: { [Op.iLike]: `%${params.search}%` } },
        { email_address: { [Op.iLike]: `%${params.search}%` } }
      ];
    }

    if (params.role !== undefined) where.user_role = params.role;
    if (params.isActive !== undefined) where.is_active = params.isActive;
    if (params.emailConfirmed !== undefined) where.email_confirmed = params.emailConfirmed;
    if (params.location_id !== undefined) where.location_id = params.location_id;

    if (params.dateFrom) {
      const [dd, mm, yyyy] = params.dateFrom.split('-');
      where.created_at = { [Op.gte]: new Date(`${yyyy}-${mm}-${dd}T00:00:00.000Z`) };
    }

    const pointsClauses = [];
    if (params.pointsMin !== undefined) {
      pointsClauses.push(
        literal(`(SELECT COALESCE(SUM(ph.points_delta), 0) FROM points_history ph WHERE ph.user_id = "users"."user_id") >= ${Number(params.pointsMin)}`)
      );
    }
    if (params.pointsMax !== undefined) {
      pointsClauses.push(
        literal(`(SELECT COALESCE(SUM(ph.points_delta), 0) FROM points_history ph WHERE ph.user_id = "users"."user_id") <= ${Number(params.pointsMax)}`)
      );
    }
    if (pointsClauses.length) {
      where[Op.and] = pointsClauses;
    }

    const consultantAreaInclude = {
      model: models.consultant_areas,
      as: 'consultant_areas',
      attributes: ['area_id', 'is_primary'],
      include: [{ model: models.areas, as: 'area', attributes: ['area_id', 'area_name'] }]
    };
    if (params.area !== undefined) {
      consultantAreaInclude.where = { area_id: params.area };
      consultantAreaInclude.required = true;
    }

    const consultantInclude = {
      model: models.consultants,
      as: 'consultant',
      attributes: ['biography'],
      include: [consultantAreaInclude]
    };
    if (params.gdprAccepted !== undefined) {
      consultantInclude.where = { gdpr_accepted: params.gdprAccepted };
    }
    if (params.gdprAccepted !== undefined || params.area !== undefined) {
      consultantInclude.required = true;
    }

    const sllInclude = {
      model: models.service_line_leaders,
      as: 'service_line_leader',
      attributes: ['service_line_id', 'biography'],
      include: [{
        model: models.service_lines,
        as: 'service_line',
        attributes: ['service_line_id', 'service_line_name']
      }]
    };
    if (params.serviceLine !== undefined) {
      sllInclude.where = { service_line_id: params.serviceLine };
      sllInclude.required = true;
    }

    return {
      where,
      include: [
        { model: models.locations, as: 'location', attributes: ['location_id', 'location_name'] },
        consultantInclude,
        { model: models.talent_managers, as: 'talent_manager', attributes: ['biography'] },
        sllInclude
      ]
    };
  };

  return Users;
};

