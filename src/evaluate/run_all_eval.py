import os
import subprocess
import pandas as pd

# Define the target image filename
target_image_name = "Llama-3_1-8B-Instruct_no_image.py_presentation.jpg"
target_image_name = "ppt_slide.png"
# Define the evaluation command function
def run_evaluation(image_file_path):
    # Define the command as a list of arguments for subprocess
    command = [
        "python", "reference_free_eval.py",
        "--image_path", image_file_path
    ]
    
    # Run the evaluation command
    try:
        subprocess.run(command, check=True)
        print(f"Evaluation ran successfully on {image_file_path}.")
    except subprocess.CalledProcessError as e:
        print(f"Error running evaluation on {image_file_path}: {e}")

# Recursively search for the target image files and run the evaluation
def find_and_evaluate_images(start_dir):
    for dirpath, _, filenames in os.walk(start_dir):
        for filename in filenames:
            if filename == target_image_name:
                image_file_path = os.path.join(dirpath, filename)
                print(f"Found file: {image_file_path}")
                run_evaluation(image_file_path)

# Aggregate results from all CSV files and calculate average scores
def aggregate_results(start_dir):
    metrics_data = []
    
    for dirpath, _, filenames in os.walk(start_dir):
        for filename in filenames:
            if filename.endswith("_evaluation.csv"):
                csv_file_path = os.path.join(dirpath, filename)
                print(f"Processing results from {csv_file_path}")
                df = pd.read_csv(csv_file_path)
                metrics_data.append(df.set_index("Metric").T)

    # Combine all the data and calculate averages
    all_metrics_df = pd.concat(metrics_data)
    averages = all_metrics_df.mean()

    # Print or save the averaged results
    print("\n--- Average Results Across All Files ---")
    print(averages)
    averages.to_csv(os.path.join(start_dir, "aggregated_average_results_gt.csv"))

if __name__ == "__main__":
    # Define the directory you want to start searching from
    start_directory = "/home/jiaxin/SlidesAgent/slidesbench/examples"

    # Start searching and running evaluation
    find_and_evaluate_images(start_directory)

    # Aggregate results and calculate averages
    aggregate_results(start_directory)
