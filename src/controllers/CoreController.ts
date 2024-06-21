/**
 * Handles all requests to read pre-set data from Oshinstar such as 
 * - Industries
 * - Categories
 * - Skills
 * - Details
 * - Features
 * - Suggestions
 */
import { Request, Response } from 'express';

const industries: object[] = [
    {
        id: 1,
        name: "Beauty & Fashion",
        order_index: 1,
        slug: "star-beauty-and-fashion",
        role_id: 1,
        icon_name: "beauty-and-fashion.svg"
    },
    {
        id: 2,
        name: "Music & Dance",
        order_index: 2,
        slug: "star-music-dance",
        role_id: 1,
        icon_name: "music-dance.svg"
    },
    {
        id: 3,
        name: "Film, T.V. & Ent.",
        order_index: 3,
        slug: "star-film-tv-ent",
        role_id: 1,
        icon_name: "film-tv-ent.svg"
    }
];

const industriesWithCategories: object[] = [
    {
      "id": 1,
      "name": "Beauty & Fashion",
      "order_index": 1,
      "slug": "star-beauty-and-fashion",
      "role_id": 1,
      "icon_name": "beauty-and-fashion.svg",
      "categories": [
        {
          "id": 10,
          "name": "Fashion Coordinator",
          "description": null,
          "slug": "fashion-coordinator",
          "industry_id": 1
        },
        {
          "id": 11,
          "name": "Modeling",
          "description": null,
          "slug": "modeling",
          "industry_id": 1
        },
        {
          "id": 13,
          "name": "Design & Manufacturing",
          "description": null,
          "slug": "design-manufacturing",
          "industry_id": 1
        },
        {
          "id": 14,
          "name": "Cosmetology",
          "description": null,
          "slug": "cosmetology",
          "industry_id": 1
        },
        {
          "id": 15,
          "name": "Beauty Pageant",
          "description": null,
          "slug": "beauty-pageant",
          "industry_id": 1
        }
      ]
    },
    {
      "id": 2,
      "name": "Music & Dance",
      "order_index": 2,
      "slug": "star-music-dance",
      "role_id": 1,
      "icon_name": "music-dance.svg",
      "categories": [
        {
          "id": 4,
          "name": "Singer",
          "description": null,
          "slug": "singer",
          "industry_id": 2
        },
        {
          "id": 5,
          "name": "Dancing",
          "description": null,
          "slug": "dancing",
          "industry_id": 2
        },
        {
          "id": 7,
          "name": "Musician",
          "description": null,
          "slug": "musician",
          "industry_id": 2
        },
        {
          "id": 8,
          "name": "Musical Composition",
          "description": null,
          "slug": "musical-composition",
          "industry_id": 2
        },
        {
          "id": 9,
          "name": "Music Production",
          "description": null,
          "slug": "music-production",
          "industry_id": 2
        }
      ]
    },
    {
      "id": 3,
      "name": "Film, T.V. & Ent.",
      "order_index": 3,
      "slug": "star-film-tv-ent",
      "role_id": 1,
      "icon_name": "film-tv-ent.svg",
      "categories": [
        {
          "id": 1,
          "name": "Filmmaking",
          "description": null,
          "slug": "filmmaking",
          "industry_id": 3
        },
        {
          "id": 2,
          "name": "Acting",
          "description": null,
          "slug": "acting",
          "industry_id": 3
        },
        {
          "id": 3,
          "name": "Radio",
          "description": null,
          "slug": "radio",
          "industry_id": 3
        },
        {
          "id": 16,
          "name": "Events & Promotions",
          "description": null,
          "slug": "events-promotions",
          "industry_id": 3
        },
        {
          "id": 17,
          "name": "Speaker",
          "description": null,
          "slug": "speaker",
          "industry_id": 3
        },
        {
          "id": 18,
          "name": "Photography",
          "description": null,
          "slug": "photography",
          "industry_id": 3
        },
        {
          "id": 19,
          "name": "Journalism",
          "description": null,
          "slug": "journalism",
          "industry_id": 3
        }
      ]
    }
  ];

abstract class CoreController {
    static async getIndustries(req: Request, reply: Response) {
        const includeCategories = req.query.categories !== undefined && req.query.categories !== null;
        reply.status(200).send({
            industries: includeCategories ? industriesWithCategories : industries
        });
    }

    
}

export default CoreController;
