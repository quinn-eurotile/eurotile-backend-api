const Promotion = require('../models/Promotion');

class PromotionService {
  /** Create or update a promotion */
  async savePromotion(req) {
    console.log('hello hiii', req.body)
    console.log('hello hiii', req.params)

    const { id } = req.params;
    try {
      if (id) {
        console.log('i ma hehe')
        return await Promotion.findByIdAndUpdate(id, req.body, { new: true });
      } else {
        const promotion = new Promotion(req.body);
        return await promotion.save();
      }
    } catch (error) {
      throw {
        message: error?.message || 'Something went wrong',
        statusCode: error?.statusCode || 500
      };
    }

  }


  /** Build query for promotion list */
  async buildPromotionListQuery(req) {
    try {
      console.log('quesy', req.query)
      const query = req.query;
      const conditionArr = [{ isDeleted: false }];

      // Filter by status
      if (query.status) {
        conditionArr.push({ status: query.status });
      }
      const searchStr = query.search_string?.trim();

      if (searchStr) {
        const searchRegex = new RegExp(searchStr, 'i');

        const orConditions = [
          { name: searchRegex },
          { description: searchRegex }
        ];

        const numericValue = parseFloat(searchStr);
        if (!isNaN(numericValue)) {
          orConditions.push({ discountValue: numericValue });
        }

        conditionArr.push({ $or: orConditions });
      }

      // Final query condition
      return conditionArr.length === 1 ? conditionArr[0] : { $and: conditionArr };
    } catch (error) {
      console.error("Error building promotion list query:", error);
      throw new Error("Failed to build promotion list query");
    }
  }

  /** Get paginated list of promotions */
  async promotionList(query, options) {
    try {
      return await Promotion.paginate(query, options);
    } catch (error) {
      console.error("Error fetching paginated promotions:", error);
      throw new Error("Failed to fetch promotions");
    }
  }


}

module.exports = new PromotionService();
