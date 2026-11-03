// Issue I, A-01-04/A-01-05. Coordinates are longitudinal station and
// transverse offset in metres. Unscheduled opening extents are traced estimates.
// Facade corrections requested in the viewer: trim the garage's left side to
// the upper wall, and continue the media-room wall to the balcony's right edge.
export const frontFacade = { garageLeft: 0.9, garageDoorLeft: 1.35, garageDoorRight: 5.8, mediaRight: 6.2 };
export const mainRoof = { base: 6.05, edge: 0.9, slope: 0.043, thickness: 0.12 };
const { garageLeft, garageDoorLeft, garageDoorRight, mediaRight } = frontFacade;

export const levels = [
  {
    base: 0, height: 2.74,
    slabs: [[0, 6.78, garageLeft, 6.28, -0.35], [3.45, 7.35, 6.28, 8.75],
      [6.78, 10.35, 0.9, 5.5], [10.35, 22.1, 0.9, 8.75], [22.1, 25.3, 0.9, 8.75]],
    exterior: [
      ['garage-front', 0, garageLeft, 0, 6.28, 'bricks', [[garageDoorLeft - garageLeft, garageDoorRight - garageLeft, -0.35, 2.13, 'garage']]],
      ['garage-side', 0, garageLeft, 6.78, garageLeft, 'bricks'],
      ['portico-return', 0, 6.28, 3.45, 6.28, 'bricks'],
      ['entry-front', 3.45, 6.28, 3.45, 8.75, 'render', [[0.28, 1.28, 0, 2.34, 'entry']]],
      ['entry-side', 3.45, 8.75, 7.35, 8.75, 'cladding'],
      ['court-front', 7.35, 5.5, 7.35, 8.75, 'cladding'],
      ['court-back', 10.35, 5.5, 10.35, 8.75, 'cladding', [[1.5, 2.35, 0, 2.1, 'door']]],
      ['kitchen-side', 10.35, 8.75, 22.1, 8.75, 'cladding', [[4.2, 6.3, 1.08, 2.22]]],
      ['living-side', 6.78, 0.9, 22.1, 0.9, 'cladding', [[0.75, 2.8, 1, 2.15], [4.4, 5.5, 1.65, 2.2], [10.7, 12.4, 1.05, 2.2]]],
      ['deck-slider', 22.1, 0.9, 22.1, 8.75, 'cladding', [[0.55, 7.3, 0, 2.42]]],
    ],
    partitions: [
      ['garage-hall', 6.05, 1.4, 6.05, 6.28, [3.58, 4.48]],
      ['guest-hall', 6.78, 4.1, 10.05, 4.1, [2.38, 3.23]],
      ['guest-bath', 10.05, 0.9, 10.05, 4.1],
      ['bath-stair', 13.28, 0.9, 13.28, 4.1],
      ['bath-hall', 10.05, 4.1, 13.28, 4.1, [0.32, 1.18]],
      ['hall-court', 7.35, 5.5, 10.35, 5.5],
      ['laundry-hall', 10.35, 5.5, 12, 5.5, [0.64, 1.49]],
      ['laundry-pantry', 12, 5.5, 12, 8.75],
      ['pantry-kitchen', 12, 5.5, 14.1, 5.5, [0.2, 1.1]],
    ],
  },
  {
    base: 3.12, height: 2.59,
    slabs: [[0, 3.45, 0.9, mediaRight], [3.45, 7.35, 0.9, 8.75],
      [7.35, 10.35, 0.9, 5.5], [10.35, 13.28, 0.9, 8.75],
      [13.28, 15.37, 4.1, 8.75], [15.37, 16.43, 0.9, 2.25], [15.37, 16.43, 4.1, 8.75], [16.43, 22.1, 0.9, 8.75], [-1, 0, 0.9, 6.2]],
    exterior: [
      ['media-front', 0, 0.9, 0, mediaRight, 'cladding', [[0.55, 4.88, 0.08, 2.24]]],
      ['media-side', 0, mediaRight, 3.45, mediaRight, 'cladding'],
      ['bed3-front', 3.45, 5.36, 3.45, 8.75, 'render'],
      ['bed3-side', 3.45, 8.75, 7.35, 8.75, 'cladding', [[0.7, 2.85, 0.85, 2.14]]],
      ['court-side-a', 7.35, 5.5, 7.35, 8.75, 'cladding'],
      ['court-side-b', 7.35, 5.5, 10.35, 5.5, 'cladding'],
      ['court-side-c', 10.35, 5.5, 10.35, 8.75, 'cladding'],
      ['bed2-side', 10.35, 8.75, 22.1, 8.75, 'cladding', [[1.3, 3.3, 0.9, 2.16], [9.6, 10.7, 1.35, 2.16]]],
      ['master-rear', 22.1, 0.9, 22.1, 8.75, 'cladding', [[0.7, 3.7, 0.62, 2.19], [4.91, 6.42, 1.39, 2.19]]],
      ['upper-long-side', 0, 0.9, 22.1, 0.9, 'cladding', [[3.4, 4.8, 1.18, 2.14], [7.2, 8.8, 0.87, 2.14], [10.8, 11.8, 1.45, 2.14], [16.7, 18.1, 1, 2.18], [19.5, 21.1, 0.85, 2.18]]],
    ],
    partitions: [
      ['media-hall', 3.45, 4.1, 5.7, 4.1, [0.35, 1.25]],
      ['media-bed4', 5.7, 0.9, 5.7, 4.1],
      ['bed4-hall', 5.7, 4.1, 10.05, 4.1, [3.22, 4.08]],
      ['bed3-hall', 3.45, 5.5, 7.35, 5.5, [2.7, 3.56]],
      ['bed4-bath', 10.05, 0.9, 10.05, 4.1],
      ['upper-bath-hall', 10.05, 4.1, 13.28, 4.1, [1.45, 2.31]],
      ['upper-bath-stair', 13.28, 0.9, 13.28, 4.1],
      ['master-front', 17.08, 0.9, 17.08, 5.5, [3.4, 4.27]],
      ['master-hall', 17.08, 5.5, 22.1, 5.5, [2.45, 3.31]],
      ['bed2-hall', 10.35, 5.5, 14.35, 5.5, [0.62, 1.48]],
      ['bed2-front', 10.35, 5.5, 10.35, 8.75],
      ['bed2-robe', 14.35, 5.5, 14.35, 8.75, [0.5, 1.36]],
      ['robe-divide', 16.32, 5.5, 16.32, 8.75, [0.55, 1.4]],
      ['ensuite', 19.72, 5.5, 19.72, 8.75, [1.08, 1.94]],
    ],
  },
];
