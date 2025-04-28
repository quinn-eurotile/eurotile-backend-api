const mongoose = require("mongoose"), Schema = mongoose.Schema;
const mongoosePaginate = require("mongoose-paginate-v2");

const PermissionSchema = new Schema(
    {
        name: { type: String, required: true, unique: true },
        module: { type: String, required: true }, 
        slug: { type: String, required: true }, 
        is_deleted: { type: Boolean, default: false },
        created_by: { type: Schema.Types.ObjectId, ref: "User", default: null },
        updated_by: { type: Schema.Types.ObjectId, ref: "User", default: null },
        created_at: { type: Date, default: Date.now },
        updated_at: { type: Date, default: Date.now }
    },
    {
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
    }
);

// Sets the created_at parameter equal to the current time
PermissionSchema.pre("save", async function (next) {
    try {
        now = new Date();
        this.updatedAt = now;
        if (this.isNew) {
            this.createdAt = now;
        }
        next();
    } catch (err) {
        next(err);
    }
});



PermissionSchema.plugin(mongoosePaginate);
module.exports = mongoose.model("Permission", PermissionSchema);
