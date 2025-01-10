import { DataTypes, Sequelize, Model, Optional } from 'sequelize';

interface PostAttributes {
  title: string;
  content: string;
  userId: string;
}

interface PostCreationAttributes extends Optional<PostAttributes, 'userId'> {}

export class Post extends Model<PostAttributes, PostCreationAttributes> implements PostAttributes {
  public id!: string;
  public title!: string;
  public content!: string;
  public userId!: string;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

export function PostFactory(sequelize: Sequelize): typeof Post {
  Post.init(
    {
      title: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      content: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'users', // Assuming you have a users table
          key: 'id',
        },
      },
    },
    {
      tableName: 'posts',
      sequelize,
    }
  );

  return Post;
}