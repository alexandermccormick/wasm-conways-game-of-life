extern crate wasm_bindgen;
extern crate console_error_panic_hook;

use std::fmt;

use wasm_bindgen::prelude::*;


#[wasm_bindgen]
extern {
    #[wasm_bindgen(js_namespace = console)]
    fn log(msg: &str);
}

#[wasm_bindgen]
pub fn wasm_panic_init() {
    use std::panic;
    panic::set_hook(Box::new(console_error_panic_hook::hook));
}

// A macro to provide `println!(..)`-style syntax for `console.log` logging.
#[allow(unused_macros)]
macro_rules! log {
    ($($t:tt)*) => (log(&format!($($t)*)))
}

#[repr(u8)]
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum Cell
{
    Dead = 0,
    Alive = 1,
}

impl Cell
{
    fn toggle(&mut self) {
        *self = match *self {
            Cell::Dead => Cell::Alive,
            Cell::Alive => Cell::Dead,
        };
    }
}

#[wasm_bindgen]
pub struct Universe
{
    width: u32,
    height: u32,
    cells: Vec<Cell>,
}

impl fmt::Display for Universe
{
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result
    {
        for line in self.cells.as_slice().chunks(self.width as usize)
        {
            for &cell in line {
                let symbol = if cell == Cell::Dead { "◻️" } else { "◼️" };
                write!(f, "{}", symbol)?;
            }
            write!(f, "\n")?;
        }
        Ok(())
    }
}

impl Universe
{
    fn get_index(&self, row: u32, column: u32) -> usize
    {
        (row * self.width + column) as usize
    }

    fn live_neighbor_count(&self, row: u32, column: u32) -> u8
    {
        let mut count = 0;
        for delta_row in [self.height - 1, 0, 1].iter().cloned()
        {
            for delta_col in [self.width - 1, 0, 1].iter().cloned()
            {
                if delta_row == 0 && delta_col == 0
                {
                    continue;
                }

                let neighbor_row = (row + delta_row) % self.height;
                let neighbor_col = (column + delta_col) % self.width;
                let idx = self.get_index(neighbor_row, neighbor_col);
                count += self.cells[idx] as u8;
            }
        }
        count
    }

    // Analyze universe, apply rules
    fn tick(&mut self)
    {
        let mut next = self.cells.clone(); // Clone current "tick" of universe to be analyzed

        for row in 0..self.height
        {
            for col in 0..self.width
            {
                let idx = self.get_index(row, col); // Index of current cell being analyzed
                let cell = self.cells[idx]; // Current cell being analyzed
                let live_neighbors = self.live_neighbor_count(row, col); // Amount of neighbors alive

                let next_cell = match (cell, live_neighbors) // Apply rules
                {
                    // Rule 1) Any live cell with fewer than 2 neighbors dies
                    (Cell::Alive, x) if x < 2 => Cell::Dead,

                    // Rule 2) Any live cell with 2 or 3 live neighbors lives
                    (Cell::Alive, 2)|(Cell::Alive, 3) => Cell::Alive,

                    // Rule 3) Any live cell with more than 3 live neighbors dies
                    (Cell::Alive, x) if x > 3 => Cell::Dead,

                    // Rule 4) Any dead cell with exactly three live neighbors becomes a live cell
                    (Cell::Dead, 3) => Cell::Alive,

                    // All other cells remain in the same state
                    (otherwise, _) => otherwise,
                };

                next[idx] = next_cell; // update cell status
            }
        }
        self.cells = next; // set analyzed "tick" as current
    }

    fn increaseTPF(&self, tick_rate: u32, median_tpf: u32)
    {
        let tpf = tick_rate - median_tpf + 1;
        // for loop here
    }
}

#[wasm_bindgen]
impl Universe
{
    pub fn toggle_cell(&mut self, row: u32, column: u32)
    {
        let idx = self.get_index(row, column);
        self.cells[idx].toggle();
    }

    // if (tickRate === fpsControlMedian) { universe.tick(); } else
    // if (tickRate > fpsControlMedian) { increaseFPS(); } else
    // if (tickRate < fpsControlMedian) { decreaseFPS(frameIter); };
    // TICKRATE FRAMEITER FPSMAX
    pub fn controller(&mut self, tick_rate: u32, frame_iter: u32, max_tpf: u32)
    {
        let median_tpf: u32 = ((max_tpf as f32 / 2_f32).floor() + 1_f32) as u32;

        if tick_rate == median_tpf { self.tick(); } else
        if tick_rate > median_tpf { self.increaseTPF(tick_rate, median_tpf); } else
        if tick_rate < median_tpf {  }
    }

    pub fn new() -> Universe
    {
        let width = 64;
        let height = 64;

        let cells = (0..width * height)
            .map(|i|
            {
                if i % 2 == 0 || i % 7 == 0
                {
                    Cell::Alive
                }
                else
                {
                    Cell::Dead
                }
            })
            .collect();

        Universe
        {
            width,
            height,
            cells,
        }
    }

    pub fn width(&self) -> u32
    {
        self.width
    }

    pub fn height(&self) -> u32
    {
        self.height
    }

    pub fn cells(&self) -> *const Cell
    {
        self.cells.as_ptr()
    }

    pub fn render(&self) -> String
    {
        self.to_string()
    }
}