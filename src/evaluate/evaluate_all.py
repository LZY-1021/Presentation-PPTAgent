import os
import argparse
import subprocess

def main():
    slides_dirs = os.listdir(f"../baseline/examples/{args.slide_name}")
    index_list = [slide_dir.split("_")[1] for slide_dir in slides_dirs]
    index_list = sorted([int(index) for index in index_list])
    for index in index_list:
        print(f"Start evaluating slide {index} ...")
        # ref-based evaluation
        pptx_path = f"../baseline/examples/{args.slide_name}/slide_{index}/{args.subdir}/gpt_4o.pptx"
        eval_path = f"../baseline/examples/{args.slide_name}/slide_{index}/{args.subdir}/ref_eval.json"
        if os.path.exists(pptx_path) and not os.path.exists(eval_path):
            command = [
                "python", "page_eval.py",
                "--reference_pptx", f"../slidesbench/examples/{args.slide_name}/{args.slide_name}.pptx",
                "--generated_pptx", pptx_path,
                "--reference_page", str(index),        
            ]
            process = subprocess.Popen(command)
            process.wait()
            print(f"Finished ref-based evaluation: {eval_path}")

        # ref-free evaluation
        jpg_page = f"../baseline/examples/{args.slide_name}/slide_{index}/{args.subdir}/gpt_4o.jpg"
        eval_path = f"../baseline/examples/{args.slide_name}/slide_{index}/{args.subdir}/gpt_4o_eval.json"
        if os.path.exists(jpg_page) and not os.path.exists(eval_path):
            command = [
                "python", "reference_free_eval.py",
                "--image_path", jpg_page,
            ]
            process = subprocess.Popen(command)
            process.wait()
            print(f"Finished ref-free evaluation: {eval_path}")
        print(f"Finish evaluating slide {index} !")



if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--slide_name", type=str, required=True)
    parser.add_argument("--subdir", type=str, default="pptx")

    args = parser.parse_args()

    main()
